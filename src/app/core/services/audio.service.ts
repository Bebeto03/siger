import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private stream?: MediaStream;
  private recorder?: MediaRecorder;
  private chunks: Blob[] = [];

  async requestMic(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
  }

  setMuted(muted: boolean) {
    this.stream?.getAudioTracks().forEach(t => (t.enabled = !muted));
  }

  startRecording() {
    if (!this.stream) return;
    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream, { mimeType: 'audio/webm' });
    this.recorder.ondataavailable = e => e.data.size && this.chunks.push(e.data);
    this.recorder.start(10_000); // um pedaço a cada 10s
  }

  stopRecording(): Promise<Blob | null> {
    return new Promise(resolve => {
      if (!this.recorder || this.recorder.state === 'inactive') return resolve(null);
      this.recorder.onstop = () => resolve(new Blob(this.chunks, { type: 'audio/webm' }));
      this.recorder.stop();
    });
  }

  release() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = undefined;
  }
}