// src/app/components/select/select.component.ts
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
  forwardRef,
  inject,
  signal,
} from "@angular/core";
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from "@angular/forms";
import { HttpClient, HttpParams } from "@angular/common/http";
import { CommonModule } from "@angular/common";
import { UI_API_CLIENT } from "../api/ui-api-client";
import { animate, style, transition, trigger } from "@angular/animations";

export interface SelectApiSource {
  url: string;
  params?: any;
  method: "GET" | "POST" | "PUT" | "DELETE";
  onFormatterResponse?: (response: any) => any;
}

export interface SelectKeysSource {
  display: string | string[];
  value: string;
}

export interface SelectSource {
  api?: SelectApiSource;
  data?: any[];
  keys: SelectKeysSource;
}

@Component({
  selector: "select-custom",
  standalone: true,
  template: `
    <section class="select-component">
      <label *ngIf="!!label" [for]="selectId">
        {{ label }}
      </label>
      <div
        class="select-container"
        #selectTrigger
        (click)="this.fetchData()"
        #selectContainer
      >
        <input
          type="text"
          class="field"
          (click)="setStateDropDown = true"
          [id]="selectId"
          [ngClass]="size"
          [(ngModel)]="searchQuery"
          (input)="filterItems()"
          [placeholder]="!selectedDisplay ? 'Pesquisar...' : selectedDisplay"
        />

        <ul
          *ngIf="this.dropDown()"
          class="select--drop-down"
          [ngStyle]="dropDownPositionStyle"
          @dropdownAnimation
        >
          <ng-container *ngIf="isLoading; else listItems">
            <li>
              <div class="loader"></div>
            </li>
          </ng-container>

          <ng-template #listItems>
            <li *ngFor="let item of filteredData" (click)="selectItem(item)">
              {{ display(item) }}
            </li>
          </ng-template>
        </ul>
      </div>
    </section>
  `,
  styleUrls: ["./select.component.scss"],
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  animations: [
    trigger("dropdownAnimation", [
      transition(":enter", [
        style({ opacity: 0, transform: "translateY(-10px)" }),
        animate(
          "200ms 100ms",
          style({ opacity: 1, transform: "translateY(0)" }),
        ),
      ]),
      transition(":leave", [
        animate("100ms", style({ opacity: 0, transform: "translateY(-10px)" })),
      ]),
    ]),
  ],
})
export class SelectComponent implements ControlValueAccessor {
  @ViewChild("selectTrigger", { static: false }) selectTriggerRef!: ElementRef;

  @Input() label?: string;
  @Input() size: "sm" | "md" | "lg" = "md";
  @Input() source!: SelectSource;

  @Output() selectedItem = new EventEmitter<any>();

  apiService = inject(UI_API_CLIENT);
  private elRef = inject(ElementRef);
  private renderer = inject(Renderer2);

  dropDown = signal<boolean>(false);

  dropDownPositionStyle: any = {};

  set setStateDropDown(state: boolean) {
    const triggerRect: any =
      this.selectTriggerRef?.nativeElement?.getBoundingClientRect();

    this.dropDownPositionStyle = {
      position: "fixed",
      top: `${triggerRect?.bottom + 10}px`,
      left: `${triggerRect?.left}px`,
      width: `${triggerRect?.width}px`,
      zIndex: 9999,
    };

    const bottomSpace = window.innerHeight - triggerRect?.bottom;
    const dropdownHeight = 300;

    if (bottomSpace < dropdownHeight) {
      this.dropDownPositionStyle.top = `${triggerRect?.top - dropdownHeight}px`;
    } else {
      this.dropDownPositionStyle.top = `${triggerRect?.bottom}px`;
    }

    this.dropDown.set(state);
  }

  data: any[] = [];
  filteredData: any[] = [];
  selectedValue: any = null;
  selectedDisplay!: string;
  isLoading = true;
  searchQuery = "";

  selectId = `select${Date.now()
    .toLocaleString()
    .replace(/[^0-9]/g, "")}`;

  onChange: any = () => {};
  onTouched: any = () => {};

  display(item: any) {
    let display = this.source.keys.display;

    if (typeof display == "string") return item[display];

    return display.map((key) => item[key]).join(" - ");
  }

  fetchData() {
    const sourceData = this.source.data;

    if (sourceData) {
      this.data = sourceData;
      this.filteredData = sourceData;
      this.isLoading = false;

      return;
    }

    const { method, url, onFormatterResponse, params } = this.source.api!;
    this.isLoading = true;

    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        httpParams = httpParams.set(key, params[key]);
      });
    }

    this.apiService.get(url, httpParams).subscribe({
      next: (response: any) => {
        this.data = response;
        this.filteredData = response;
        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  selectItem(item: any) {
    this.selectedDisplay = this.display(item);
    this.selectedValue = item[this.source.keys.value];

    this.setStateDropDown = false;

    this.onChange(this.selectedValue);

    this.selectedItem.emit(item);
  }

  clearSelection() {
    this.selectedValue = null;
    this.onChange(null);
  }

  filterItems() {
    this.filteredData = this.data.filter((item) => {
      let display = this.source.keys.display;

      if (typeof display == "string")
        return (<string>display)
          .toLocaleLowerCase()
          .includes(this.searchQuery.toLowerCase());

      return display.some((key) =>
        item[key]
          ?.toString()
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase()),
      );
    });
  }

  openDropdown() {
    this.setStateDropDown = true;
  }

  closeDropdown() {
    this.setStateDropDown = false;
  }

  @HostListener("document:click", ["$event"])
  onClickOutside(event: MouseEvent) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  writeValue(value: any): void {
    if (value === undefined || value === null) return;

    this.selectedValue = value;

    if (this.data.length) {
      console.log("data");

      const selectedItem = this.data.find(
        (item) => item[this.source.keys.value] == value,
      );

      if (selectedItem) {
        this.selectedDisplay = this.display(selectedItem);
      }
    } else {
      this.fetchDataAndSetSelectedDisplay(value);
    }
  }

  private fetchDataAndSetSelectedDisplay(value: any) {
    if (this.source.data) {
      this.data = this.source.data;
      this.filteredData = this.source.data;
      this.isLoading = false;

      const selectedItem = this.data.find(
        (item) => item[this.source.keys.value] == value,
      );

      if (selectedItem) {
        this.selectedDisplay = this.display(selectedItem);
      }

      return;
    }

    const { method, url, onFormatterResponse, params } = this.source.api!;
    this.isLoading = true;

    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        httpParams = httpParams.set(key, params[key]);
      });
    }

    this.apiService.get(url, httpParams).subscribe({
      next: (response: any) => {
        this.data = response;
        this.filteredData = response;
        this.isLoading = false;

        const selectedItem = this.data.find(
          (item) => item[this.source.keys.value] == value,
        );

        if (selectedItem) {
          this.selectedDisplay = this.display(selectedItem);
        }
      },
      error: () => (this.isLoading = false),
    });
  }
}
