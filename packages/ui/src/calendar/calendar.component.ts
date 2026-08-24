import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  parseISO,
} from "date-fns";

export interface CalendarEvent {
  name: string;
  date?: string;
  dateInit?: string;
  dateEnd?: string;
  color: string;
  onClick?: () => void;
}

@Component({
  selector: "calendar",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./calendar.component.html",
  styleUrl: "./calendar.component.scss",
})
export class CalendarComponent {
  @Input() events: CalendarEvent[] = [];
  @Output() dateSelected = new EventEmitter<{
    day: number;
    month: number;
    year: number;
  }>();

  currentDate: Date = new Date();
  days: Date[] = [];
  mappedEvents: { [date: string]: CalendarEvent[] } = {};

  ngOnInit(): void {
    this.generateCalendar();
  }

  generateCalendar(): void {
    const start = startOfMonth(this.currentDate);
    const end = endOfMonth(this.currentDate);
    this.days = eachDayOfInterval({ start, end });
    this.mapEventsToDates();
  }

  mapEventsToDates(): void {
    this.mappedEvents = {};
    for (const event of this.events) {
      if (event.date) {
        const key = format(parseISO(event.date), "yyyy-MM-dd");
        if (!this.mappedEvents[key]) this.mappedEvents[key] = [];
        this.mappedEvents[key].push(event);
      } else if (event.dateInit && event.dateEnd) {
        const range = eachDayOfInterval({
          start: parseISO(event.dateInit),
          end: parseISO(event.dateEnd),
        });
        for (const day of range) {
          const key = format(day, "yyyy-MM-dd");
          if (!this.mappedEvents[key]) this.mappedEvents[key] = [];
          this.mappedEvents[key].push(event);
        }
      }
    }
  }

  nextMonth(): void {
    this.currentDate = addMonths(this.currentDate, 1);
    this.generateCalendar();
  }

  prevMonth(): void {
    this.currentDate = subMonths(this.currentDate, 1);
    this.generateCalendar();
  }

  onSelectDay(day: Date): void {
    this.dateSelected.emit({
      day: day.getDate(),
      month: day.getMonth() + 1,
      year: day.getFullYear(),
    });
  }

  getEvents(day: Date): CalendarEvent[] {
    const key = format(day, "yyyy-MM-dd");
    return this.mappedEvents[key] || [];
  }
}
