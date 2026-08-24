import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";

@Component({
  selector: "avatar",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./avatar.component.html",
  styleUrl: "./avatar.component.scss",
})
export class AvatarComponent {
  size = input<"sm" | "md" | "lg">("md");
  user = input<any>(null);

  get avatarSize() {
    return `avatar--${this.size()}`;
  }

  get avatar() {
    return this.user()?.avatar ?? "https://i.pravatar.cc/150?img=";
  }

  get username() {
    return this.user()?.username ?? "Manager";
  }
}
