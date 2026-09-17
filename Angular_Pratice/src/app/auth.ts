import { Service , signal} from '@angular/core';

@Service()
export class Auth {
    isLoggedIn =signal(false);

    login(){
        this.isLoggedIn.set(true);
    }
    logout(){
        this.isLoggedIn.set(false);
    }
}
