import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DataService } from 'src/app/services/data.service';
import { OverlayService } from 'src/app/services/overlay.service';
import { Category } from 'src/app/models/category.model';

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.scss']
})
export class AddCategoryComponent {

  newCategory: string = '';
  newColor: string = '';

  categoryForm = new FormGroup({
    newCategory: new FormControl('', Validators.required),
    newColor: new FormControl('', Validators.required)
  });

  constructor(
    private dataService: DataService,
    public oS: OverlayService
    ) { }


  async createCategory() {
    let category = new Category(0, this.newCategory, this.newColor);
    this.dataService.createCategory(category);
    this.closeCategoryForm();
  }


  closeCategoryForm() {
    this.newCategory = '';
    this.newColor = '';
    this.oS.categoryOverlayVisible = false;
  }

}
