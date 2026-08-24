import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class LoaderService {
  private loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  show() {
    this.loading.next(true);

    return {
      hide: () => this.hide(),
    };
  }

  hide() {
    this.loading.next(false);
  }
}
