import { Routes } from '@angular/router';
import { HomeComp } from './home-comp/home-comp';
import { AboutComp } from './about-comp/about-comp';
import { ContactComp } from './contact-comp/contact-comp';
import { Dashboard } from './dashboard/dashboard';
import { Profile } from './dashboard/profile/profile';
import { Setting } from './dashboard/setting/setting';
import { HomeComponent } from './home-component/home-component';
import { ContactComponent } from './contact-component/contact-component';
import { AboutComponent } from './about-component/about-component';
import { PageNotFound } from './page-not-found/page-not-found';
import { ProductComp } from './product-comp/product-comp';
import { ProductsComp } from './products-comp/products-comp';

export const routes: Routes = [
    // { path: 'home',component:HomeComp},
    // { path: 'about',component: AboutComp},
    // { path: 'contact',component: ContactComp}

    // {path: 'dashboard', component:Dashboard,
    //     children: [
    //         {path: 'profile',component: Profile},
    //         {path: 'setting', component:    Setting}
    //     ]
    // },
    // {path: '', redirectTo: 'dashboard',pathMatch: 'full'}

    //   {path: '', component:HomeComponent},
    //   {path: 'about',component:AboutComponent},
    //   {path: 'contact', component:ContactComponent},
    //   {path: '**',component: PageNotFound}


    // {path: 'product/:id', component: ProductComp},
    // {path: 'products', component: ProductsComp}
];
