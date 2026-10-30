import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Meeting } from '../../../core/models/meeting.model';
import { MeetingService } from '../../../core/services/meeting.service';
import { AudioService } from '../../../core/services/audio.service';
import { AuthService } from '../../../core/services/auth.service';
import { Topic, TopicService } from '../../../core/services/topic.service';
import { MeetingMinutes, MeetingMinutesService } from '../../../core/services/meeting-minutes.service';
import { Participant, ParticipantRequestDTO, ParticipantParticipation } from '../../../core/models/participant.model';
import { ParticipantService } from '../../../core/services/participant.service';

export interface AgendaItem {
    id: number;
    title: string;
    durationMin: number;
    status: 'pending' | 'active' | 'done';
    responsibleParticipant: ParticipantRequestDTO | null;
    startedAt?: number;
    elapsedSeconds: number;
    text: {notes: string; decisions: string;}
}

@Component({
    selector: 'app-reuniao-sala',
    standalone: true,
    imports: [],
    templateUrl: './reuniao-sala-remota.html',
})
export class ReuniaoSalaRemota implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private meetingService = inject(MeetingService);
    private meetingMinutesService = inject(MeetingMinutesService);
    private participantService = inject(ParticipantService);
    private topicService = inject(TopicService);
    private audio = inject(AudioService);
    private auth = inject(AuthService);

    meetingId = Number(this.route.snapshot.paramMap.get('id'));
    meeting = signal<Meeting | null>(null);
    meetingMinutes = signal<MeetingMinutes | null>(null);
    participants = signal<Participant[]>([]);

    agenda = signal<AgendaItem[]>([]);
    currentIndex = signal(0);
    current = computed(() => this.agenda()[this.currentIndex()]);

    private meetingStorageKey = '';

    now = signal(Date.now());
    private startedAt = Date.now();
    private timer?: ReturnType<typeof setInterval>;

    micState = signal<'idle' | 'on' | 'muted' | 'denied'>('idle');
    recording = signal(false);
    ending = signal(false);
    meetingActive = signal(false);
    isPresent = signal(false);

    isOrganizer = computed(() => this.auth.temQualquerPermissao(['ROLE_ORGANIZADOR']));
    meetingElapsed = computed(() => Math.max(0,Math.floor(this.now() - this.startedAt) / 1000));
    meetingOvertimeElapsed = computed(() => Math.trunc(((this.meetingElapsed() - (this.meeting()!.duration * 60))/60))) ;
    agendaElapsed = computed(() => {
        const item = this.current();

        if (!item) return 0;

        const elapsedNow = item.startedAt
            ? Math.floor((this.now() - item.startedAt) / 1000)
            : 0;

        return item.elapsedSeconds + elapsedNow;
    });
    agendaOvertimeElapsed = computed(() => Math.trunc(((this.agendaElapsed() - (this.current()!.durationMin * 60))/60)));
    overtime = computed(() => {
        const c = this.current();
        return !!c && this.agendaElapsed() > c.durationMin * 60;
    });
    overtimeMeeting = computed(() => {
        return !!this.meeting() && this.meetingElapsed() > this.meeting()?.duration! * 60;
    });

    async ngOnInit() {
        const m = await this.meetingService.buscar(this.meetingId);
        // se m.status não for "em andamento", redirecione para o detalhe
        this.meeting.set(m);

        this.isPresent.set(m.isPresent!)

        this.meetingActive.set(m.status === 'EM_ANDAMENTO');

        const minutes = await this.meetingMinutesService.buscarPorReuniao(this.meetingId);
        this.meetingMinutes.set(minutes)

        // troque pela pauta real da reunião quando existir no backend
        const topics: Topic[] = await this.topicService.listaPorAta(minutes?.id!);

        const priorityOrder: Record<string, number> = {
            ALTA: 1,
            MEDIA: 2,
            BAIXA: 3
        };

        const sortedTopics = [...topics].sort(
            (a, b) =>
                (priorityOrder[a.priority] ?? 99) -
                (priorityOrder[b.priority] ?? 99)
        );


        // troque pela pauta real da reunião quando existir no backend
        const items: AgendaItem[] = sortedTopics.map(topic => ({
            id: topic.id!,
            title: topic.title,
            durationMin: topic.time!,
            priority: topic.priority,
            responsibleParticipant: topic.responsibleParticipant ?? null,
            elapsedSeconds: 0,
            status: 'pending',
            text: {
                notes: '',
                decisions: ''
            }
        }));

        if (items.length > 0) {
            items[0] = {
                ...items[0],
                status: 'active',
                startedAt: Date.now()
            };
        }
        this.agenda.set(items);
        this.currentIndex.set(0);

        // Restaurar os cronômetros depois de carregar as pautas.
        this.configurarCacheTimer(this.meetingId);  
        // Atualizar o relógio e salvar o estado periodicamente.
        this.timer = setInterval(() => {this.now.set(Date.now()); this.salvarCacheTimer();}, 1000);

        const participantes = await this.participantService.listarPorReuniao(this.meetingId)
        this.participants.set(participantes);
    }

    ngOnDestroy() {
        if (this.timer) {
            clearInterval(this.timer);
        }

        this.audio.release();
    }

    // ---------- Pautas ----------
    next(): void {
        const i = this.currentIndex();
        const list = this.agenda();

        if (i >= list.length - 1) return;

        const now = Date.now();

        this.agenda.update(items =>
            items.map((item, idx) => {
                if (idx === i) {
                    return {
                        ...this.pauseAgendaItem(item),
                        status: 'done' as const
                    };
                }

                if (idx === i + 1) {
                    return {
                        ...item,
                        status: 'active' as const,
                        startedAt: now
                    };
                }

                return item;
            })
        );

        this.currentIndex.set(i + 1);
        this.salvarCacheTimer();
    }

    previous(): void {
        const i = this.currentIndex();
        const list = this.agenda();

        if (i === 0) return;

        const now = Date.now();

        this.agenda.update(items =>
            items.map((item, idx) => {
                if (idx === i) {
                    return {
                        ...this.pauseAgendaItem(item),
                        status: 'pending' as const
                    };
                }

                if (idx === i - 1) {
                    return {
                        ...item,
                        status: 'active' as const,
                        startedAt: now
                    };
                }

                return item;
            })
        );

        this.currentIndex.set(i - 1);
        this.salvarCacheTimer();
    }

    private pauseAgendaItem(item: AgendaItem): AgendaItem {
        if (!item.startedAt) {
            return item;
        }

        const elapsed = Math.max(
            0,
            Math.floor((Date.now() - item.startedAt) / 1000)
        );

        return {
            ...item,
            elapsedSeconds: item.elapsedSeconds + elapsed,
            startedAt: undefined
        };
    }

    updateNotes(value: string): void {
        this.updateAgendaText('notes', value);
    }

    updateDecisions(value: string): void {
        this.updateAgendaText('decisions', value);
    }

    private updateAgendaText(field: 'notes' | 'decisions',value: string): void {
        const i = this.currentIndex();
        this.agenda.update(list =>
            list.map((item, idx) =>
                idx === i
                    ? {
                        ...item,
                        text: {
                            ...item.text,
                            [field]: value
                        }
                    }: item));
        this.salvarCacheTimer();
    }

    // ---------- Áudio ----------
    async enableMic() {
        try {
            await this.audio.requestMic();
            this.micState.set('on');
        } catch {
            this.micState.set('denied');
        }
    }

    toggleMute() {
        const muted = this.micState() === 'on';
        this.audio.setMuted(muted);
        this.micState.set(muted ? 'muted' : 'on');
    }

    toggleRecording() {
        if (this.recording()) {
            this.audio.stopRecording();
            this.recording.set(false);
        } else {
            this.audio.startRecording();
            this.recording.set(true);
        }
    }

    // ---------- Encerrar ----------

    async canDeactivate(): Promise<boolean> {
        if (!this.meetingActive()) {
            return true;
        }

        const shouldEnd = confirm(
            'A reunião está em andamento. Deseja encerrá-la e navegar para outra página?'
        );

        if (!shouldEnd) {
            return false;
        }

        return await this.finishMeeting();
    }

    // Lógica compartilhada de encerramento
    private async finishMeeting(): Promise<boolean> {
        if (this.ending()) {
            return false;
        }

        this.ending.set(true);

        try {
            if (this.recording()) {
                await this.audio.stopRecording();
                this.recording.set(false);
            }

            await this.consolidarAta();
            this.meeting.update(meeting =>
                meeting
                    ? {
                        ...meeting,
                        participants: this.participants()
                    }
                    : null
            );
            await this.meetingService.finalizar(this.meetingId);

            this.meetingActive.set(false);
            this.ending.set(false);

            if (this.meetingStorageKey) {
                localStorage.removeItem(this.meetingStorageKey);
            }

            return true;
        } catch (error) {
            console.error('Erro ao encerrar a reunião:', error);
            this.ending.set(false);
            return false;
        }
    }

    // Encerramento pelo botão da tela
    async endMeeting(): Promise<void> {
        if (!this.meetingActive()) {
            return;
        }

        if (!confirm('Encerrar a reunião para todos os participantes?')) {
            return;
        }

        const success = await this.finishMeeting();

        if (success) {
            await this.router.navigate(['/reunioes', this.meetingId]);
        }
    }

    fmt(totalSec: number): string {
        const total = Math.floor(Math.max(0, totalSec));

        const minutes = Math.floor(total / 60)
            .toString()
            .padStart(2, '0');

        const seconds = (total % 60)
            .toString()
            .padStart(2, '0');

        return `${minutes}:${seconds}`;
    }

    initials(name: string): string {
        if (!name?.trim()) return '??';
        const parts = name.trim().split(' ').filter(Boolean);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    async confirmParticipation(participant: Participant): Promise<void> {
        await this.updateParticipation(participant, 'SIM');
    }

    async rejectParticipation(participant: Participant): Promise<void> {
        await this.updateParticipation(participant, 'NAO');
    }

    private async updateParticipation(participant: Participant, participation: ParticipantParticipation): Promise<void> {

        if (!participant.id) {
            console.error('Participante sem ID.');
            return;
        }

        try {
            // Atualiza no backend.
            const updatedParticipant = await this.participantService.editar(
                participant.id,
                {
                    ...participant,
                    participation
                }
            );

            // Atualiza o Signal de participantes.
            const updatedParticipants = this.participants().map(item =>
                item.id === participant.id
                    ? updatedParticipant
                    : item
            );

            this.participants.set(updatedParticipants);

            // Atualiza também os participantes da reunião.
            this.meeting.update(meeting =>
                meeting
                    ? {
                        ...meeting,
                        participants: updatedParticipants
                    }
                    : null
            );

        } catch (error) {
            console.error('Erro ao atualizar participação:', error);
        }
    }

    private configurarCacheTimer(meetingId: number): void {
        this.meetingStorageKey = `reuniao-timers-${meetingId}`;

        const cache = localStorage.getItem(this.meetingStorageKey);

        if (!cache) {
            this.salvarCacheTimer();
            return;
        }

        try {
            const saved = JSON.parse(cache);

            this.startedAt = saved.startedAt ?? Date.now();

            const savedTopics = saved.topics ?? {};

            this.agenda.update(items =>
            items.map(topic => {
                const topicCache = savedTopics[String(topic.id)];

                if (!topicCache) {
                return topic;
                }

                // Recupera os textos do novo formato.
                const savedText = topicCache.text;

                // Compatibilidade com o formato antigo do localStorage.
                const oldNotes =
                    typeof topicCache.notes === 'string'
                        ? topicCache.notes
                        : '';

                return {
                    ...topic,
                    elapsedSeconds: topicCache.elapsedSeconds ?? 0,
                    startedAt: topicCache.startedAt ?? undefined,
                    status: topicCache.status ?? topic.status,

                    text: {
                        notes:
                            typeof savedText?.notes === 'string'
                                ? savedText.notes
                                : oldNotes,

                        decisions:
                            typeof savedText?.decisions === 'string'
                                ? savedText.decisions
                                : (
                                    typeof topicCache.decisions === 'string'
                                        ? topicCache.decisions
                                        : ''
                                )}};
                }));

            const savedIndex = saved.currentIndex ?? 0;
            const maxIndex = Math.max(0, this.agenda().length - 1);

            this.currentIndex.set(
                Math.min(Math.max(savedIndex, 0), maxIndex)
            );

            // Salva novamente no novo formato.
            this.salvarCacheTimer();

        } catch (error) {
            console.error('Erro ao restaurar o cache dos cronômetros:', error);
            this.salvarCacheTimer();
        }
    }

    private salvarCacheTimer(): void {
        if (!this.meetingStorageKey) return;

        const topics: Record<string, {
            elapsedSeconds: number;
            startedAt: number | null;
            status: AgendaItem['status'];
            text: {
                notes: string;
                decisions: string;
            };
        }> = {};

        for (const topic of this.agenda()) {
            topics[String(topic.id)] = {
                elapsedSeconds: topic.elapsedSeconds ?? 0,
                startedAt: topic.startedAt ?? null,
                status: topic.status,

                text: {
                    notes: topic.text?.notes ?? '',
                    decisions: topic.text?.decisions ?? ''
                }
            };
        }

        localStorage.setItem(
            this.meetingStorageKey,
            JSON.stringify({
                startedAt: this.startedAt,
                currentIndex: this.currentIndex(),
                topics
            })
        );
    }

    warningTime(time: Number){
        return time === 0 ? `` : `em ${time} minuto(s)`;
    }
    private async consolidarAta(): Promise<void> {
        // Busca a ata já existente da reunião.
        const minutes = await this.meetingMinutesService.buscarPorReuniao(
            this.meetingId
        );

        if (!minutes?.id) {
            throw new Error('Ata da reunião não encontrada.');
        }

        // Busca todas as pautas cadastradas nessa ata.
        const topics = await this.topicService.listaPorAta(minutes.id);

        // Recupera as informações digitadas durante a reunião.
        const agendaItems = this.agenda();

        // Cria um mapa para relacionar os dados da tela com os tópicos do backend.
        const agendaMap = new Map(
            agendaItems.map(item => [item.id, item])
        );

        // Consolida todas as anotações.
        const notes = topics
            .map(topic => {
                const agendaItem = agendaMap.get(topic.id!);
                const content = agendaItem?.text?.notes?.trim();

                if (!content) return null;

                return `${topic.title}: ${content}`;
            })
            .filter((item): item is string => item !== null)
            .join('\n');

        // Consolida todas as decisões.
        const decisions = topics
            .map(topic => {
                const agendaItem = agendaMap.get(topic.id!);
                const content = agendaItem?.text?.decisions?.trim();

                if (!content) return null;

                return `${topic.title}: ${content}`;
            })
            .filter((item): item is string => item !== null)
            .join('\n');

        // Atualiza todas as pautas para concluídas.
        await Promise.all(
            topics.map(topic =>
                this.topicService.editar(topic.id!, {
                    meetingMinutes: { id: minutes.id! },
                    participant: topic.responsibleParticipant
                        ? { id: topic.responsibleParticipant.id }
                        : undefined,
                    title: topic.title,
                    priority: topic.priority,
                    timer: topic.time,
                    orderIndex: topic.orderIndex,
                    concluded: true
                })
            )
        );

        // Atualiza a ata com as anotações e decisões consolidadas.
        await this.meetingMinutesService.editar(minutes.id, {
            meeting: { id: this.meetingId },
            objectives: minutes.objectives ?? '',
            notes,
            decision: decisions
        });

        // Atualiza também o estado local das pautas.
        this.agenda.update(items =>
            items.map(item => ({
                ...this.pauseAgendaItem(item),
                status: 'done' as const
            }))
        );

        this.salvarCacheTimer();
    }
}