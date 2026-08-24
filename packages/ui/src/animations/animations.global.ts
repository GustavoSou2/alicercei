import { animate, style, transition, trigger } from "@angular/animations";

export const errorAnimation = trigger("errorAnimation", [
  transition(":enter", [
    style({ height: "0px", opacity: 0 }),
    animate("300ms ease-out", style({ height: "15px", opacity: 1 })),
  ]),
  transition(":leave", [
    animate("200ms ease-in", style({ height: "0px", opacity: 0 })),
  ]),
]);

export const fadeInOut = trigger("fadeInOut", [
  transition(":enter", [
    style({ opacity: 0 }),
    animate("300ms ease-out", style({ opacity: 1 })),
  ]),
  transition(":leave", [animate("200ms ease-in", style({ opacity: 0 }))]),
]);
