import { inject, Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmationDialogComponent } from "../confirmation-dialog.component";

@Injectable({
  providedIn: "root",
})
export class ConfirmationDialogService {
  private dialogService = inject(MatDialog);
  constructor() {}

  open(data: {
    title: string;
    message?: string;
    messageHTML?: string;
    cancelButton: { text: string; color: string };
    confirmButton: { text: string; color: string };
  }) {
    return this.dialogService.open(ConfirmationDialogComponent, {
      data: data,
    });
  }
}
