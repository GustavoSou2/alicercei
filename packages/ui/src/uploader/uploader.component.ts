import { CommonModule } from "@angular/common";
import { Component, forwardRef, Input } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { BehaviorSubject } from "rxjs";

@Component({
  selector: "uploader",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./uploader.component.html",
  styleUrl: "./uploader.component.scss",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UploaderComponent),
      multi: true,
    },
  ],
})
export class UploaderComponent implements ControlValueAccessor {
  @Input() accept: string | null = null;
  @Input() multiple = false;
  @Input() id = this.randomId();
  @Input() name = this.randomName();

  files: File[] = [];
  fileNames: any[] = [];

  private onChange: (value: File | File[] | null) => void = () => {};
  private onTouched: () => void = () => {};

  private isDisabled = new BehaviorSubject(false);
  isDisabled$ = this.isDisabled.asObservable();

  randomName() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  randomId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  writeValue(value: File | File[] | null): void {
    if (value instanceof File) {
      this.files = [value];
    } else if (Array.isArray(value)) {
      this.files = value;
    } else {
      this.files = [];
    }

    this.fileNames = this.files.map((file) => {
      const fileName = file.name;
      const fileExtension = fileName.includes(".")
        ? fileName.split(".").pop()!.toLowerCase()
        : "";
      const sizeInKB = (file.size / 1024).toFixed(2) + " KB";

      return {
        fileName,
        fileExtension,
        size: sizeInKB,
      };
    });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled.next(isDisabled);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectedFiles = input.files;

    if (!selectedFiles) return;

    this.files = Array.from(selectedFiles);
    this.fileNames = this.files.map((file) => {
      const fileName = file.name;
      const fileExtension = fileName.includes(".")
        ? fileName.split(".").pop()!.toLowerCase()
        : "";
      const sizeInKB = (file.size / 1024).toFixed(2) + " KB";

      return {
        fileName,
        fileExtension,
        size: sizeInKB,
      };
    });

    const valueToEmit = this.multiple ? this.files : (this.files[0] ?? null);

    this.onChange(valueToEmit);
    this.onTouched();
  }
}
