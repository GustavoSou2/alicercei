import { Component, inject, Inject, signal } from "@angular/core";
import { ButtonComponent } from "../button/button.component";
import { CommonModule } from "@angular/common";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: "app-confirmation-dialog",
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: "./confirmation-dialog.component.html",
  styleUrl: "./confirmation-dialog.component.scss",
})
export class ConfirmationDialogComponent {
  confirmationDialogRef = inject(MatDialogRef<ConfirmationDialogComponent>);
  confirmationDialog = signal<any>(null);

  get title() {
    return this.confirmationDialog().title;
  }

  get message() {
    return this.confirmationDialog()?.message;
  }

  get messageHTML() {
    return this.confirmationDialog()?.messageHTML;
  }

  get cancelButton() {
    return this.confirmationDialog().cancelButton;
  }

  get confirmButton() {
    return this.confirmationDialog().confirmButton;
  }

  constructor(@Inject(MAT_DIALOG_DATA) private data: any) {
    this.confirmationDialog.set(data);

    console.log(data);
  }

  cancel() {
    this.confirmationDialogRef.close(false);
  }

  confirm() {
    this.confirmationDialogRef.close(true);
  }
}
