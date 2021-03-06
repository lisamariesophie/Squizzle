import { Component, OnInit } from '@angular/core';
import { QuestionCreateComponent } from '../question-create/question-create.component';
import { Topic } from 'src/app/_models/topic.model';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TopicsDatabaseService } from 'src/app/_services/topics-database.service';
import { AngularFireStorage } from '@angular/fire/storage';
import { TopicUsersService } from 'src/app/_services/topicUsers.service';
import { UsersService } from 'src/app/_services/users.service';
import { AuthenticationService } from 'src/app/_services/authentication.service';
import { ConnectionService } from 'src/app/_services/connection.service';
import { TopicsService } from 'src/app/_services/topics.service';

@Component({
  selector: 'app-question-list',
  templateUrl: './question-list.component.html',
  styleUrls: ['./question-list.component.scss']
})
export class QuestionListComponent implements OnInit {

  topic: Topic;
  topicId: string;
  quizUrl: string = '';

  constructor(public connectionService: ConnectionService, protected route: ActivatedRoute, public router: Router, private localTopics: TopicsService, private topicsService: TopicsDatabaseService, protected topicUserService: TopicUsersService, protected userService: UsersService, protected authService: AuthenticationService, protected modalService: NgbModal, private storage: AngularFireStorage) { }

  ngOnInit(): void {
    this.topicId = this.route.snapshot.paramMap.get('id');
    this.getTopic();
    this.quizUrl = `quizgenerator-6dc7c.firebaseapp.com/quizzes/quiz/${this.topicId}`
  }

  // get topic by topicId
  getTopic() {
    if (this.connectionService.isOnline) {
      this.topicsService.getTopic(this.topicId).subscribe(res => {
        this.topic = res;
      });
    }
    else {
      this.topic = this.localTopics.getTopic(this.topicId);
    }
  }

  get maxScore() {
    let points = 0;
    if (this.topic == null) {
      return 0;
    }
    if (!this.topic.hasOwnProperty('quiz')) {
      return 0;
    }
    for (let question of this.topic.quiz.questions) {
      points += question.points;
    }
    return points;
  }

  
  deleteQuestion(question) {
    if (confirm('Frage löschen?')) {
      if (question.imgUrl != null) {
        this.deleteImgFromStorage(question.imgUrl);
      }
      for (let i = 0; i < this.topic.quiz.questions.length; i++) {
        if (this.topic.quiz.questions[i].id === question.id) {
          this.topic.quiz.questions.splice(i, 1);
        }
        if (this.connectionService.isOnline) {
          this.authService.user.subscribe(user => {
            if (user) {
              const userId = user.uid;
              this.topicsService.updateTopic(userId, this.topicId, this.topic);
            }
          });
        }
        else{
          this.localTopics.updateTopic(this.topic)
        }
      }
    }
  }

  // Delete Image from Firebase Storage
  deleteImgFromStorage(imgUrl: string) {
    return this.storage.storage.refFromURL(imgUrl).delete();
  }

  setLive() {
    this.topic.isLive = !this.topic.isLive;
    console.log(this.topic.isLive)
    this.authService.user.subscribe(user => {
      if (user) {
        const userId = user.uid;
        this.topicsService.updateTopic(userId, this.topicId, this.topic);
      }
    });
  }

  openFormModal(topic: Topic) {
    const modalRef = this.modalService.open(QuestionCreateComponent, { ariaLabelledBy: 'create-question', backdrop: 'static', windowClass: "modal-wide" });
    modalRef.componentInstance.topic = topic;
    modalRef.componentInstance.id = this.topicId;
    modalRef.result.then((result) => {
    }).catch((error) => {
    });
  }
}
