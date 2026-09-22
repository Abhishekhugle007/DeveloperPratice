import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../models/user';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  apiURL = 'http://localhost:3000/posts';

  constructor(private http: HttpClient) {}
   

  // get all users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiURL);
  }
  

  // add a new users
  addUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiURL, user);
  }

  // update an existing  user(put API)

  updateUser(id: number, user:User): Observable<User>{
    return this.http.put<User>(`${this.apiURL}/${id}`,user);
  }
   
  // patch API to update a PART of the user DATA

  updateUserStatus(id: number, status: boolean): Observable<User>{
    return this.http.patch<User>(`${this.apiURL}/${id}`, { isActive: status });
} 
// delete a user
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiURL}/${id}`);
  }
}
