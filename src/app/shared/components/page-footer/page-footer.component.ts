import { Component } from '@angular/core';

@Component({
  selector: 'app-page-footer',
  standalone: true,
  template: `
    <footer class="merchant-footer">
      <span>© {{ currentYear }} 101 Premium Financial Service. All rights reserved.</span>
      <div>
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">API Docs</a>
      </div>
    </footer>
  `
})
export class PageFooterComponent {
  protected readonly currentYear = new Date().getFullYear();
}
