import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketsService } from '../../../core/services/tickets.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-tickets-history',
  imports: [CommonModule],
  templateUrl: './tickets-history.component.html',
  styleUrls: ['./tickets-history.component.scss']
})
export class TicketsHistoryComponent implements OnInit {
  protected tickets: any[] = [];
  protected isLoading = false;
  protected errorMessage = '';

  constructor(
    private ticketsService: TicketsService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadClosedTickets();
  }

  private loadClosedTickets(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.ticketsService.getClosedTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.error || err.message || 'No fue posible cargar el historial de tickets.';
        this.tickets = [];
        this.isLoading = false;
      }
    });
  }
}
