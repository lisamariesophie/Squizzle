import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TopicsDatabaseService } from 'src/app/_services/topics-database.service';
import { TopicUsersService } from 'src/app/_services/topicUsers.service';
import { UsersService } from 'src/app/_services/users.service';
import { AuthenticationService } from 'src/app/_services/authentication.service';
import { ConnectionService } from 'src/app/_services/connection.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(private route: ActivatedRoute, private router: Router,  protected authService: AuthenticationService) { }

  ngOnInit() { }

  showComponent() {
    const id = this.route.snapshot.paramMap.get('id');
    if (this.router.url == `/admin/quiz/${id}`) {
      return 'quiz';
    }
    else if (this.router.url == `/admin/topic/${id}`) {
      return 'questions';
    }
    else if (this.router.url == `/admin/quiz/scores/${id}`) {
      return 'scores';
    }
  }

  

  
}
