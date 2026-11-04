import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';

const SEGMENT_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class AudioService {
  private http = inject(HttpClient);
  private stream?: MediaStream;
  private recorder?: MediaRecorder;
  private rotateTimer?: ReturnType<typeof setInterval>;
  private wakeLock?: WakeLockSentinel;
  private meetingId = 0;
  private index = 0;
  private queue: Promise<void> = Promise.resolve();
  private failed: number[] = [];

  private url(path: string) {
    return `${environment.apiUrl}/meeting/${this.meetingId}/audio/${path}`;
  }

  private get indexKey() {
    return `audio-next-index-${this.meetingId}`;
  }

  /** Dispara o prompt de permissão do navegador. Lança erro se negado. */
  async requestMic(): Promise<void> {
    if (this.stream?.active) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true }
    });
  }

  setMuted(muted: boolean) {
    this.stream?.getAudioTracks().forEach(t => (t.enabled = !muted));
  }

  async startRecording(meetingId: number): Promise<void> {
    if (!this.stream) throw new Error('Microfone não habilitado');
    this.meetingId = meetingId;
    this.index = Number(localStorage.getItem(this.indexKey) ?? 0); // continua após recarregar
    this.failed = [];
    this.queue = Promise.resolve();

    try { this.wakeLock = await navigator.wakeLock?.request('screen'); } catch {}

    this.startSegment();
    this.rotateTimer = setInterval(() => this.rotate(), SEGMENT_MS);
  }

  /** Cada segmento é um MediaRecorder novo, então o arquivo é um webm completo. */
  private startSegment() {
    const index = this.index++;
    localStorage.setItem(this.indexKey, String(this.index));

    const parts: Blob[] = [];
    const rec = new MediaRecorder(this.stream!, {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 32_000
    });
    rec.ondataavailable = e => { if (e.data.size) parts.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(parts, { type: 'audio/webm' });
      this.queue = this.queue.then(() => this.uploadSegment(index, blob));
    };
    rec.start();
    this.recorder = rec;
  }

  /** Inicia o novo antes de parar o antigo, para não perder áudio na troca. */
  private rotate() {
    const old = this.recorder;
    this.startSegment();
    old?.stop();
  }

  async stopRecording(): Promise<void> {
    clearInterval(this.rotateTimer);
    const rec = this.recorder;
    if (!rec || rec.state === 'inactive') return;

    await new Promise<void>(resolve => {
      const prev = rec.onstop;
      rec.onstop = ev => { prev?.call(rec, ev); resolve(); };
      rec.stop();
    });

    await this.queue;
    if (this.failed.length) {
      throw new Error(`Segmentos não enviados: ${this.failed.join(', ')}`);
    }
    await firstValueFrom(this.http.post(this.url('complete'), { totalSegments: this.index }));
    localStorage.removeItem(this.indexKey);
    await this.wakeLock?.release();
  }

  private async uploadSegment(index: number, blob: Blob, tries = 3): Promise<void> {
    for (let t = 1; t <= tries; t++) {
      try {
        await firstValueFrom(this.http.post(this.url(`segments?index=${index}`), blob, {
          headers: { 'Content-Type': 'application/octet-stream' }
        }));
        return;
      } catch {
        if (t === tries) this.failed.push(index);
        else await new Promise(r => setTimeout(r, 1000 * t));
      }
    }
  }

  /** Libera o microfone (apaga o ícone de gravação do navegador). */
  release() {
    clearInterval(this.rotateTimer);
    if (this.recorder?.state === 'recording') this.recorder.stop();
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = undefined;
    this.wakeLock?.release();
  }
}