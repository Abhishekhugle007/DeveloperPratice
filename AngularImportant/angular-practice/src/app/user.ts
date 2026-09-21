import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, of } from 'rxjs';

export interface UserData {
  id: number;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class User {
  apiURL = 'http://localhost:3000/posts';

  constructor(private http: HttpClient) {}

  getUsers() {
    return this.http.get<UserData[]>(this.apiURL).pipe(         
      catchError((error) => {
        console.error('Unable to load users:', error);
        return of([]);
      })
    );
  }
}

