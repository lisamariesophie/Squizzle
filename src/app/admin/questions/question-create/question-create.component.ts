import { Component, OnInit, Input } from '@angular/core';
import { GapText } from 'src/app/_models/gaptext.model';
import { FormControl, FormArray, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Topic } from 'src/app/_models/topic.model';
import { TopicsDatabaseService } from 'src/app/_services/topics-database.service';
import { ActivatedRoute } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/storage';
import { finalize } from 'rxjs/operators';
import { Question } from 'src/app/_models/question.model';
import { AuthenticationService } from 'src/app/_services/authentication.service';
import { ToastService } from 'src/app/_services/toast.service';

@Component({
  selector: 'app-question-create',
  templateUrl: './question-create.component.html',
  styleUrls: ['./question-create.component.scss']
})
export class QuestionCreateComponent implements OnInit {

  @Input() topic: Topic;
  @Input() id: string;

  form: FormGroup;
  submitted: boolean = false;
  answers: Array<any> = [];
  answersArray: Array<any> = [];
  gapText: Array<any> = [];
  correct: Array<any> = [];
  solution: any = '';
  gapCounter: number = 0;

  // image update
  imgSrc: string = '';
  selectedImg: any = null;
  downloadUrl: string;


  constructor(public activeModal: NgbActiveModal, private toast: ToastService,
    private formBuilder: FormBuilder, private topicsService: TopicsDatabaseService, private route: ActivatedRoute, private authService: AuthenticationService, private storage: AngularFireStorage) { }

  ngOnInit() {
    this.createForm();
  }

  private createForm() {
    this.form = this.formBuilder.group({
      type: ['', Validators.required]
    });
  }

  get formControls() { return this.form.controls; }

  get checkArray() {
    return this.form.get('checkArray') as FormArray;
  }

  // get type of question
  get selectedType() {
    return this.formControls.type.value;
  }

  // add or delete from checkArray on checkbox value changed
  onCheckboxChange(e) {
    if (e.target.checked) {
      this.checkArray.push(new FormControl(e.target.value));
    }
    else {
      let i: number = 0;
      this.checkArray.controls.forEach((item: FormControl) => {
        if (item.value == e.target.value) {
          this.checkArray.removeAt(i);
          return;
        }
        i++;
      });
    }
  }

  // create formcontrols for each question type
  public setForm(event) {
    const value = event.target.value;
    if (value == 1) {
      this.resetAnswers(); 
      this.form.addControl('name', new FormControl('', Validators.required));
      this.form.addControl('imgUrl', new FormControl(''));
      this.form.addControl('checkArray', new FormArray([]));
      this.form.addControl('addAnswer', new FormControl(''));
      this.form.addControl('points', new FormControl('', Validators.required));
      this.form.addControl('hint', new FormControl(''));
    }
    if (value == 2) {
      this.resetAnswers(); 
      this.answers = ["Wahr", "Falsch"];
      this.form.addControl('name', new FormControl('', Validators.required));
      this.form.addControl('imgUrl', new FormControl(''));
      this.form.addControl('checkArray', new FormArray([]));
      this.form.addControl('points', new FormControl('', Validators.required));
      this.form.addControl('hint', new FormControl(''));
    }
    else if (value == 3) {
      this.resetAnswers(); 
      this.answers = [{ value: "Stimme gar nicht zu" }, { value: "Stimme nicht zu", correct: true }, { value: "Neutral", correct: true }, { value: "Stimme zu", correct: true }, { value: "Stimme voll zu", correct: true }, { value: "Keine Angabe", correct: true }];
      this.form.addControl('name', new FormControl('', Validators.required));
    }
    else if (value == 5) {
      this.resetAnswers(); 
      this.form.addControl('name', new FormControl('', Validators.required));
      this.form.addControl('addAnswer', new FormControl(''));
      this.form.addControl('points', new FormControl('', Validators.required));
      this.form.addControl('hint', new FormControl(''));
    }
    else if (value == 6) {
      this.resetAnswers(); 
      this.gapText = [];
      this.form.addControl('name', new FormControl('', Validators.required));
      this.form.addControl('addGapText', new FormControl(''));
      this.form.addControl('addGap', new FormControl(''));
      this.form.addControl('points', new FormControl('', Validators.required));
    }
    else {
      this.resetAnswers(); 

    }
  }

  // add new answer to checkbox array
  public addAnswer() {
    this.answers.push(this.formControls.addAnswer.value);
    this.formControls.addAnswer.reset();
  }

  // create Gaptext
  public addGapText(type: number) {
    let gapText: GapText = new GapText();
    if (type == 1) {
      gapText.type = 1;
      gapText.value = this.formControls.addGapText.value;
      this.formControls.addGapText.reset();
    }
    else if (type == 2) {
      gapText.type = 2;
      gapText.value = this.formControls.addGap.value;
      this.formControls.addGap.reset();
    }
    gapText.id = this.gapCounter;
    this.gapCounter++;
    this.gapText.push(gapText);
    this.solution += gapText.value;
  }

  // submit Form
  public submitForm() {
    this.createQuestion();
    this.activeModal.close(this.form.value);
  }

  createQuestion() {
    let question;
    // stop here if form is invalid
    if (this.submitted && this.form.invalid) {
      console.log("Form invalid")
      return;
    }
    // MC or True/False Question
    if ((this.selectedType == 1 && this.selectedImg == null) || this.selectedType == 2) {
      this.markCorrectAnswers();
      question = this.createMCQuestion();
      this.updateQuestion(question);
      this.resetForm();
      this.resetAnswers(); 
    }
    // Image Question
    else if (this.selectedType == 1 && this.selectedImg != null) {
      this.markCorrectAnswers();
      this.createImgQuestion();
      this.resetAnswers(); 
    }
    // Evaluation
    else if (this.selectedType == 3) {
      question = this.createEvaluation();
      this.updateQuestion(question);
      this.resetForm();
      this.resetAnswers(); 
    }
    // Text Question
    else if (this.selectedType == 5) {
      question = this.createTextQuestion();
      this.updateQuestion(question);
      this.resetForm();
      this.resetAnswers(); 
    }
    // Gap Question
    else if (this.selectedType == 6) {
      question = this.createGapQuestion();
      this.updateQuestion(question);
      this.resetForm();
      
    }
  }

  markCorrectAnswers() {
    // loop answers
    for (let i = 0; i < this.answers.length; i++) {
      // if answer in checkbox array is checked --> mark as correct and push to answersArray
      if (this.answers[i] == this.checkArray.value) {
        this.answersArray.push({ value: this.answers[i], correct: true })
      }
      else {
        this.answersArray.push({ value: this.answers[i], correct: false })
      }
    }
  }

  createMCQuestion(): Question {
    const question = {
      id: this.generateID(),
      name: this.formControls.name.value,
      type: this.formControls.type.value,
      answers: Object.assign(this.answersArray),
      points: this.formControls.points.value,
      hint: this.formControls.hint.value,
      hintOpened: false
    }
    return question;
  }

  createEvaluation(): Question {
    const question = {
      id: this.generateID(),
      name: this.formControls.name.value,
      type: this.formControls.type.value,
      points: 0,
      answers: Object.assign(this.answers)
    }
    return question;
  }

  createTextQuestion() {
    this.correct.push(this.formControls.addAnswer.value);
    const question = {
      id: this.generateID(),
      name: this.formControls.name.value,
      type: this.formControls.type.value,
      points: this.formControls.points.value,
      answers: [],
      hint: this.formControls.hint.value,
      hintOpened: false,
      isCorrected: false
    }
    return question;
  }

  createGapQuestion() {
    var map = this.gapText.map((obj) => { return Object.assign({}, obj) });
    const question = {
      id: this.generateID(),
      type: this.formControls.type.value,
      name: this.formControls.name.value,
      gapText: map,
      points: this.formControls.points.value
    }
    return question;
  }

  createImgQuestion() {
    const filePath = `images/${this.selectedImg.name.split('.').slice(0, -1).join('.')}_${new Date().getTime()}` // avoid duplicate filenames
    const fileRef = this.storage.ref(filePath);
    this.storage.upload(filePath, this.selectedImg).snapshotChanges().pipe(
      finalize(() => {
        fileRef.getDownloadURL().subscribe((url) => {
          const question = {
            id: this.generateID(),
            imgUrl: url,
            name: this.formControls.name.value,
            type: this.formControls.type.value,
            answers: Object.assign(this.answersArray),
            points: this.formControls.points.value,
            hint: this.formControls.hint.value,
            hintOpened: false
          }
          console.log(question)
          this.updateQuestion(question);
        })
      })).subscribe(res => {
      }); //finalize -> wait for update complete
    this.imgSrc = '';
    this.selectedImg = null;

  }

  // update firebase topic with new question 
  updateQuestion(question: any) {
    if (!this.topic.hasOwnProperty('quiz')) {
      const quiz = { questions: [], submitted: false };
      this.topic.quiz = quiz;
    }
    this.topic.quiz.questions.push(question);
    this.authService.user.subscribe(user => {
      if (user) {
        const userId = user.uid;
        this.topicsService.updateTopic(userId, this.id, this.topic).then(res => {
          this.toast.showSuccess("Frage hinzugefügt");
        }).catch(err => {
          this.toast.showError("Frage konnte nicht hinzugefügt werden: " + err);
        });
      }
    });
  }

  // Image Preview inside Form
  showImgPrev(event: any) {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.imgSrc = e.target.result;
      reader.readAsDataURL(event.target.files[0]);
      this.selectedImg = event.target.files[0];
    } else {
      //reset if no Img chosen
      this.imgSrc = '';
      this.selectedImg = null;
    }
  }

  resetForm() {
    this.answers = [];
    this.form.reset();
  }

  resetAnswers() {
    if(this.checkArray != null){
      this.checkArray.reset();
    }
    this.answers = [];
  }

  private generateID(): string {
    return (
      Number(String(Math.random()).slice(2)) +
      Date.now() +
      Math.round(performance.now())
    ).toString(36);
  }

  // convert numbers to letters
  toLetters(num) {
    "use strict";
    var mod = num % 26,
      pow = num / 26 | 0,
      out = mod ? String.fromCharCode(64 + mod) : (--pow, 'Z');
    return pow ? this.toLetters(pow) + out : out;
  }

  // convert letters to numbers
  fromLetters(str) {
    "use strict";
    var out = 0, len = str.length, pos = len;
    while (--pos > -1) {
      out += (str.charCodeAt(pos) - 64) * Math.pow(26, len - 1 - pos);
    }
    return out;
  }
}