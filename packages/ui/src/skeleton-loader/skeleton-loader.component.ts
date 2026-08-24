import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  Renderer2,
} from "@angular/core";

@Component({
  selector: "skeleton-loader",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./skeleton-loader.component.html",
  styleUrl: "./skeleton-loader.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonLoaderComponent implements AfterViewInit {
  @Input() loading = false;

  skeletons: {
    width: string;
    height: string;
    radius: string;
  }[] = [];

  constructor(
    private hostRef: ElementRef,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit() {
    if (this.loading) {
      const native = this.hostRef.nativeElement;
      const content = native.querySelector("[ng-content]") || native;
      const children = content.querySelectorAll("*");

      this.skeletons = Array.from(children)
        .filter((el) => el instanceof HTMLElement)
        .map((el: HTMLElement) => {
          const style = getComputedStyle(el);
          return {
            width: style.width || "100%",
            height: style.height || "1rem",
            radius: style.borderRadius || "0.375rem",
          };
        });

      this.cdr.detectChanges();
    }
  }
}
