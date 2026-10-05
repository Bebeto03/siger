import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Meeting } from '../../../core/models/meeting.model';
import { MeetingService } from '../../../core/services/meeting.service';
import { AudioService } from '../../../core/services/audio.service';
import { AuthService } from '../../../core/services/auth.service';

export interface AgendaItem {
    id: number;
    title: string;
    durationMin: number;
    status: 'pending' | 'active' | 'done';
    startedAt?: number;
    notes: string;
}

@Component({
    selector: 'app-reuniao-sala',
    standalone: true,
    imports: [],
    templateUrl: './reuniao-sala.html',
})
export class ReuniaoSala implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private meetingService = inject(MeetingService);
    private audio = inject(AudioService);
    private auth = inject(AuthService);

    meetingId = Number(this.route.snapshot.paramMap.get('id'));
    meeting = signal<Meeting | null>(null);

    agenda = signal<AgendaItem[]>([]);
    currentIndex = signal(0);
    current = computed(() => this.agenda()[this.currentIndex()]);

    now = signal(Date.now());
    private startedAt = Date.now();
    private timer?: ReturnType<typeof setInterval>;

    micState = signal<'idle' | 'on' | 'muted' | 'denied'>('idle');
    recording = signal(false);
    ending = signal(false);

    isOrganizer = computed(() => this.auth.temQualquerPermissao(['ROLE_ORGANIZADOR']));
    meetingElapsed = computed(() => Math.floor((this.now() - this.startedAt) / 1000));
    agendaElapsed = computed(() => {
        const c = this.current();
        return c?.startedAt ? Math.floor((this.now() - c.startedAt) / 1000) : 0;
    });
    overtime = computed(() => {
        const c = this.current();
        return !!c && this.agendaElapsed() > c.durationMin * 60;
    });

    async ngOnInit() {
        const m = await this.meetingService.buscar(this.meetingId);
        // se m.status não for "em andamento", redirecione para o detalhe
        this.meeting.set(m);

        // troque pela pauta real da reunião quando existir no backend
        const items: AgendaItem[] = [
            { id: 1, title: 'Abertura', durationMin: 5, status: 'pending', notes: '' },
            { id: 2, title: 'Revisão do backlog', durationMin: 15, status: 'pending', notes: '' },
            { id: 3, title: 'Riscos e bloqueios', durationMin: 10, status: 'pending', notes: '' },
        ];
        items[0] = { ...items[0], status: 'active', startedAt: Date.now() };
        this.agenda.set(items);

        this.timer = setInterval(() => this.now.set(Date.now()), 1000);
    }

    ngOnDestroy() {
        clearInterval(this.timer);
        this.audio.release();
    }

    // ---------- Pautas ----------
    next() {
        const i = this.currentIndex();
        if (i >= this.agenda().length - 1) return;
        this.agenda.update(list =>
            list.map((it, idx) =>
                idx === i ? { ...it, status: 'done' } :
                    idx === i + 1 ? { ...it, status: 'active', startedAt: Date.now() } : it));
        this.currentIndex.set(i + 1);
    }

    previous() {
        const i = this.currentIndex();
        if (i === 0) return;
        this.agenda.update(list =>
            list.map((it, idx) =>
                idx === i ? { ...it, status: 'pending', startedAt: undefined } :
                    idx === i - 1 ? { ...it, status: 'active', startedAt: Date.now() } : it));
        this.currentIndex.set(i - 1);
    }

    updateNotes(value: string) {
        const i = this.currentIndex();
        this.agenda.update(list => list.map((it, idx) => (idx === i ? { ...it, notes: value } : it)));
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
    async endMeeting() {
        if (!confirm('Encerrar a reunião para todos os participantes?')) return;
        this.ending.set(true);
        try {
            const audio = await this.audio.stopRecording();
            // próximo passo: enviar `audio` ao backend
            await this.meetingService.finalizar(this.meetingId);
            this.router.navigate(['/reunioes', this.meetingId]);
        } catch {
            this.ending.set(false);
        }
    }

    fmt(totalSec: number): string {
        const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const s = (totalSec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }
}