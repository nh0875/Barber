import { Injectable, MessageEvent } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class RealtimeService {
  private readonly events$ = new Subject<MessageEvent>();

  getEventStream(): Observable<MessageEvent> {
    return this.events$.asObservable();
  }

  emit(type: 'CUT_CREATED' | 'CUT_UPDATED' | 'PAYMENT_CREATED' | 'BOARD_REFRESH', data?: any) {
    this.events$.next({ data: JSON.stringify({ type, payload: data }) });
  }
}
