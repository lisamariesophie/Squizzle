import { Component, OnInit } from '@angular/core';
import { Topic } from 'src/app/_models/topic.model';
import { ActivatedRoute } from '@angular/router';
import { ConnectionService } from 'src/app/_services/connection.service';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})
export class SideNavComponent implements OnInit {

  topic: Topic;
  topicId: string; 

  constructor(private route: ActivatedRoute, public connectionService: ConnectionService) { }
    

  ngOnInit(): void {
    this.topicId = this.route.snapshot.paramMap.get('id');
  }
}
