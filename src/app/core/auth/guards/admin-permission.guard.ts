import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AdminPermission, permissionsForUser } from '../../../features/admin/admin-navigation';

@Injectable({ providedIn: 'root' })
export class AdminPermissionGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const permission = route.data['permission'] as AdminPermission | undefined;
    return this.authService.restoreSession().pipe(
      map((user) => permission && permissionsForUser(user).includes(permission)
        ? true
        : this.router.createUrlTree(['/dashboard'])),
      catchError(() => of(this.router.createUrlTree(['/login'])))
    );
  }
}