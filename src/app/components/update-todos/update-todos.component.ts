import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Todo } from 'src/app/models/todo.model';
import { DataService } from 'src/app/services/data.service';
import { OverlayService } from 'src/app/services/overlay.service';
import { Location, LocationStrategy, PathLocationStrategy, formatDate } from '@angular/common';
import { Subtask } from 'src/app/models/subtask.model';
import { Subscription } from 'rxjs';

@Component({
  providers: [Location, { provide: LocationStrategy, useClass: PathLocationStrategy }],
  selector: 'app-update-todos',
  templateUrl: './update-todos.component.html',
  styleUrls: ['./update-todos.component.scss']
})
export class UpdateTodosComponent implements OnInit, OnDestroy {

  title: string = this.oS.currentTodo?.title || '';
  description: string = this.oS.currentTodo?.description || '';
  status: boolean = this.oS.currentTodo?.completed || false;
  category: number = this.oS.currentTodo?.category || 0;
  priority: number = this.oS.currentTodo?.priority || 0;
  dueDate: Date = this.oS.currentTodo?.due_date || new Date();
  assignedTo: number[] = this.oS.currentTodo?.assigned_to || [];

  newAssignments: boolean = false;


  todoForm = new FormGroup({
    category: new FormControl(),
    title: new FormControl(),
    description: new FormControl(),
    completed: new FormControl(),
    priority: new FormControl(),
    due_date: new FormControl(this.oS.currentTodo?.due_date ?
      formatDate(this.oS.currentTodo?.due_date, 'yyyy-MM-dd', 'en-US') : null),
    assigned_to: new FormControl(),
    subtasks: new FormControl()
  });

  subscription: Subscription | undefined;


  constructor(
    public oS: OverlayService,
    public dataService: DataService,
    private location: Location,
  ) { }


  ngOnInit(): void {
    console.log("Init update component");
    this.subscription = this.dataService.subtasks$.subscribe((subtasks) => {
      this.oS.subtasksFull = subtasks.filter((subtask) => {
        return this.oS.subtasks.includes(subtask.id as number);
      });
    });
  }


  ngOnDestroy(): void {
    console.log("destroying update component");
    this.subscription?.unsubscribe();
  }


  openCategoryForm() {
    this.category = 0;
    this.oS.categoryOverlayVisible = true;
  }


  displayColor(e: any) {
    let color = e.target.value.split(',')[1];
    e.target.style.color = color;
  }


  isSelected(id: number) {
    return this.assignedTo.includes(id);
  }


  hasNewAssignments() {
    this.newAssignments = true;
  }


  undoChangedAssignments() {
    this.newAssignments = false;
  }


  resetAssignments() {
    this.assignedTo = [];
  }


  openContactForm() {
    this.assignedTo = [];
    this.oS.contactOverlayVisible = true;
  }


  updateSubtaskTitle($event: any, sub: Subtask) {
    if (sub.id != null)
      this.oS.subtasksFull[this.oS.subtasks.indexOf(sub.id)].title = $event.target.value;
  }


  updateSubtaskStatus($event: any, sub: Subtask) {
    if (sub.id != null)
      this.oS.subtasksFull[this.oS.subtasks.indexOf(sub.id)].completed = $event.target.checked;
  }


  async deleteSubtask(sub: Subtask) {
    if (sub.id != null)
      this.oS.subtasksFull.splice(this.oS.subtasks.indexOf(sub.id), 1);
    this.oS.currentTodo?.subtasks?.splice(this.oS.currentTodo?.subtasks?.indexOf(sub.id as number), 1);
    await this.dataService.deleteSubtaskById(sub.id as number);
  }


  async createSubtasks() {
    for (let sub of this.oS.subtasksFull) {
      if (sub.id == null) {
        sub.todo = this.oS.currentTodo?.id as number;
        const subtask = await this.dataService.createSubtask(sub);
        this.oS.subtasks.push(subtask);
        this.dataService.refreshSubtasks();
      } else {
        const subtask = await this.dataService.updateSubtaskById(sub);
      }
    }
  }

  /**
   * Main update function that is triggerd when the user clicks the update button.
   */
  async updateTodo() {
    await this.createSubtasks();
    let todo = this.addChanges();
    todo.subtasks = this.oS.subtasks;
    await this.dataService.updateTodoById(todo as Todo);
    this.oS.currentTodo = await this.dataService.getTodoById(this.oS.currentTodo?.id as number);
    this.close();
  }


  addChanges() {
    let todo = {
      ...this.oS.currentTodo
    };
    this.todoForm.value.title !== '' ? todo.title = this.todoForm.value.title : null;
    this.todoForm.value.description !== '' ? todo.description = this.todoForm.value.description : null;
    this.todoForm.value.completed !== this.oS.currentTodo?.completed ? todo.completed = this.todoForm.value.completed : null;
    this.todoForm.value.category !== this.oS.currentTodo?.category ? todo.category = this.todoForm.value.category : null;
    this.todoForm.value.priority !== this.oS.currentTodo?.priority ? todo.priority = this.todoForm.value.priority : null;
    this.todoForm.value.due_date === todo.due_date ? null : todo.due_date = this.prepareDate(this.todoForm.value.due_date);
    this.todoForm.value.assigned_to !== this.oS.currentTodo?.assigned_to ? todo.assigned_to = this.todoForm.value.assigned_to : null;
    return todo;
  }


  /**
   * Transforms a date string into a Date object.
   * @param date as string.
   * @returns a Date object.
   */
  prepareDate(date: string | null | undefined) {
    if (date === null || date === undefined) { return undefined }
    let dateArr = date.split('-');
    let year = parseInt(dateArr[0]);
    let month = parseInt(dateArr[1]) - 1;
    let day = parseInt(dateArr[2]);
    return new Date(year, month, day);
  }


  noBubble($event: any) {
    $event.stopPropagation();
  }


  close() {
    this.oS.subtasks = [];
    this.location.back();
  }
}
