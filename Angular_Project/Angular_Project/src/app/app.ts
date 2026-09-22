import { Component, OnDestroy, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  styleUrls: ['./app.css'],
  templateUrl: './app.html',
})
export class App implements OnInit, OnDestroy {
  title = signal('Angular Project');
  currentTime = signal(new Date());

  worldClocks = [
    { country: 'India', zone: 'Asia/Kolkata' },
    { country: 'USA', zone: 'America/New_York' },
    { country: 'Japan', zone: 'Asia/Tokyo' },
    { country: 'UK', zone: 'Europe/London' },
  ];

  intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.intervalId = globalThis.setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) {
      globalThis.clearInterval(this.intervalId);
    }
  }

  formatTime(zone: string): string {
    return this.currentTime().toLocaleTimeString('en-US', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  formatDate(zone: string): string {
    return this.currentTime().toLocaleDateString('en-US', {
      timeZone: zone,
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }
} 