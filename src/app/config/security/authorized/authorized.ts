import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthorizationService } from '../authorization.service';
import { Router } from '@angular/router';
import { take } from 'rxjs';

@Component({
  selector: 'app-authorized',
  standalone: true,
  imports: [],
  templateUrl: './authorized.html',
  styleUrl: './authorized.scss',
})
export class Authorized implements OnInit {

  code : any= '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private route: Router,
    private authorizationService: AuthorizationService,
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams
    .pipe(take(1))
    .subscribe((params: any) => {
      if (params.code) {
        this.authorizationService.obterNovoAccessTokenComCode(params.code, params.state)
          .then(() => {
            this.authorizationService.carregarToken();
            this.route.navigate([''])
          })
          .catch((e: any) => {
            this.route.navigate(['/login'])
          });
      } else {
        this.route.navigate(['']);
      }
    });
  }

}