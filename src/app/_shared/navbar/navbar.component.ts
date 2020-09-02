import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from 'src/app/_services/authentication.service';
import { User } from 'src/app/_models/user';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  user: User;
  
  constructor(public authService: AuthenticationService) { }

  ngOnInit(): void {
    this.authService.user.subscribe(user => this.user = user)
  }

}
