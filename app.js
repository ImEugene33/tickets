
const MOVIES = [
  { title: "Kill Bill", poster: "images/kbposter7.jpg" },
  { title: "Pulp Fiction", poster: "/images/pfposter3.jpg" },
  { title: "Once Upon a Time in Hollywood", poster: "/images/newpostit.jpg" },
  { title: "The Hateful Eight", poster: "/images/hatefuleightposter2.jpg" },
];

const SEATS_PER_ROW = 5;
const ROWS = 5;
const SEAT_PRICE = 100;
const SHOWTIMES = [10, 12, 14, 16, 18, 20];

const getStorageKey = (movie, date, time) => `${movie}_${date}_${time}`;

const getSeatLabel = (index, seatsPerRow) => {
  const row = Math.floor(index / seatsPerRow);
  const col = index % seatsPerRow + 1;
  return `${String.fromCharCode(65 + row)}${col}`;
};

class BookingApp {
  constructor() {
    this.selectedMovie = null;
    this.selectedDate = null;
    this.selectedTime = null;
    this.selectedSeats = new Set();

    this.elements = {
      movieList: document.getElementById('movieList'),
      dates: document.getElementById('dates'),
      times: document.getElementById('times'),
      ticketInfo: document.getElementById('ticketInfo'),
      ticketMovie: document.getElementById('ticketMovie'),
      ticketDate: document.getElementById('ticketDate'),
      ticketTime: document.getElementById('ticketTime'),
      ticketSeats: document.getElementById('ticketSeats'),
      ticketTotal: document.getElementById('ticketTotal'),
      bookedTickets: document.getElementById('bookedTickets'),
      bookedList: document.getElementById('bookedList'),
      screen: document.getElementById('screen'),
      seatsContainer: document.getElementById('seatsContainer'),
      rowLabels: document.getElementById('rowLabels'),
      bookButton: document.getElementById('bookButton'),
      resetButton: document.getElementById('resetButton'),
      toast: document.getElementById('toast'),
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.renderMovies();
    this.hideScreenAndSeats();
    this.hideTicketInfo();
    this.renderBookedTickets();
  }

  bindEvents() {
    this.elements.bookButton.addEventListener('click', () => this.bookSeats());
    this.elements.resetButton.addEventListener('click', () => this.resetAll());
  }

  renderMovies() {
    this.elements.movieList.innerHTML = '';
    MOVIES.forEach((movie, index) => {
      const div = document.createElement('div');
      div.classList.add('movie');
      div.innerHTML = `<img src="${movie.poster}" alt="${movie.title}"><p class="movie-title">${movie.title}</p>`;
      div.addEventListener('click', () => this.selectMovie(index));
      this.elements.movieList.appendChild(div);
    });
  }

  selectMovie(index) {
    this.selectedMovie = MOVIES[index].title;
    this.selectedDate = null;
    this.selectedTime = null;
    this.selectedSeats.clear();

    document.querySelectorAll('.movie').forEach((el, i) => {
      el.classList.toggle('selected', i === index);
    });

    this.hideScreenAndSeats();
    this.hideTicketInfo();
    this.renderDates();
  }

  renderDates() {
    this.elements.dates.innerHTML = '';
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      const div = document.createElement('div');
      div.classList.add('date');
      div.textContent = date.toDateString();
      div.addEventListener('click', () => {
        this.selectedDate = date.toDateString();
        document.querySelectorAll('.date').forEach(el => el.classList.remove('selected'));
        div.classList.add('selected');
        this.selectedTime = null;
        this.hideScreenAndSeats();
        this.hideTicketInfo();
        this.renderTimes();
      });
      this.elements.dates.appendChild(div);
    }
  }

  renderTimes() {
    this.elements.times.innerHTML = '';
    SHOWTIMES.forEach(hour => {
      const div = document.createElement('div');
      div.classList.add('time');
      div.textContent = `${hour}:00`;
      div.addEventListener('click', () => {
        this.selectedTime = `${hour}:00`;
        document.querySelectorAll('.time').forEach(el => el.classList.remove('selected'));
        div.classList.add('selected');
        this.showScreenAndSeats();
        this.renderSeats();
        this.updateTicketInfo();
      });
      this.elements.times.appendChild(div);
    });
  }

  renderSeats() {
    this.selectedSeats.clear();
    this.elements.seatsContainer.innerHTML = '';
    this.elements.rowLabels.innerHTML = '';
    const stored = JSON.parse(localStorage.getItem(getStorageKey(this.selectedMovie, this.selectedDate, this.selectedTime))) || [];

    for (let row = 0; row < ROWS; row++) {
      this.elements.rowLabels.innerHTML += `<span>${String.fromCharCode(65 + row)}</span>`;
      for (let col = 0; col < SEATS_PER_ROW; col++) {
        const index = row * SEATS_PER_ROW + col;
        const seat = document.createElement('div');
        seat.classList.add('seat');
        seat.dataset.index = index;
        seat.dataset.price = SEAT_PRICE;
        if (stored.includes(index)) seat.classList.add('booked');
        seat.addEventListener('click', () => {
          if (seat.classList.contains('booked')) return;
          seat.classList.toggle('selected');
          if (this.selectedSeats.has(index)) {
            this.selectedSeats.delete(index);
          } else {
            this.selectedSeats.add(index);
          }
          this.updateTicketInfo();
        });
        this.elements.seatsContainer.appendChild(seat);
      }
    }
  }

  renderBookedTickets() {
    this.elements.bookedList.innerHTML = '';
    let hasBookings = false;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const [movie, date, time] = key.split('_');
      const seats = JSON.parse(localStorage.getItem(key)) || [];
      if (seats.length > 0) {
        hasBookings = true;
        const bookingDiv = document.createElement('div');
        bookingDiv.classList.add('booking-entry');
        bookingDiv.innerHTML = `
          <p>Movie: ${movie}, Date: ${date}, Time: ${time}, Seats: ${seats.length}</p>
          <input type="email" class="email-input" autocomplete="off" placeholder="Enter your email">
          <button class="send-email-button">📧 Send by Email</button>
        `;
        const emailButton = bookingDiv.querySelector('.send-email-button');
        const emailInput = bookingDiv.querySelector('.email-input');
        emailButton.addEventListener('click', () => this.sendBookedTicketByEmail(movie, date, time, seats, emailInput));
        this.elements.bookedList.appendChild(bookingDiv);
      }
    }

    this.elements.bookedTickets.classList.toggle('show', hasBookings);
  }

  bookSeats() {
    if (!this.selectedMovie || !this.selectedDate || !this.selectedTime) {
      return this.showToast('Please select movie, date, and time');
    }
    if (this.selectedSeats.size === 0) {
      return this.showToast('Please select at least one seat');
    }

    const key = getStorageKey(this.selectedMovie, this.selectedDate, this.selectedTime);
    const stored = new Set(JSON.parse(localStorage.getItem(key)) || []);
    this.selectedSeats.forEach(seat => stored.add(seat));
    localStorage.setItem(key, JSON.stringify([...stored]));
    this.showToast('Seats booked!');
    this.renderSeats();
    this.updateTicketInfo();
    this.renderBookedTickets();
  }

  resetAll() {
    localStorage.clear();
    this.selectedMovie = null;
    this.selectedDate = null;
    this.selectedTime = null;
    this.selectedSeats.clear();
    this.hideScreenAndSeats();
    this.hideTicketInfo();
    this.elements.dates.innerHTML = '';
    this.elements.times.innerHTML = '';
    this.renderMovies();
    this.renderBookedTickets();
    this.showToast('All bookings cleared');
  }

  sendBookedTicketByEmail(movie, date, time, seats, emailInput) {
    const email = emailInput.value.trim();
    if (!email) {
      return this.showToast('Please enter an email address');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return this.showToast('Please enter a valid email address');
    }

    const seatLabels = seats.map(index => getSeatLabel(index, SEATS_PER_ROW)).join(', ');
    const totalPrice = seats.length * SEAT_PRICE;

    const templateParams = {
      email: email,
      movie: movie,
      date: date,
      time: time,
      seats: seatLabels,
      total: `${totalPrice}₴`,
    };

    emailjs.send('service_k0gzh74', 'template_4h95lpn', templateParams)
      .then(() => {
        this.showToast('Tickets sent to your email!');
        emailInput.value = '';
      }, (error) => {
        this.showToast('Failed to send email. Please try again.');
        console.error('EmailJS error:', error);
      });
  }

  showToast(message) {
    this.elements.toast.textContent = message;
    this.elements.toast.style.display = 'block';
    setTimeout(() => {
      this.elements.toast.style.display = 'none';
    }, 2000);
  }

  hideScreenAndSeats() {
    this.elements.screen.style.display = 'none';
    this.elements.seatsContainer.style.display = 'none';
    this.elements.rowLabels.style.display = 'none';
  }

  showScreenAndSeats() {
    this.elements.screen.style.display = 'block';
    this.elements.seatsContainer.style.display = 'grid';
    this.elements.rowLabels.style.display = 'flex';
  }

  updateTicketInfo() {
    if (!this.selectedMovie || !this.selectedDate || !this.selectedTime) {
      this.hideTicketInfo();
      return;
    }

    this.elements.ticketInfo.classList.add('show');
    this.elements.ticketMovie.textContent = `Movie: ${this.selectedMovie}`;
    this.elements.ticketDate.textContent = `Date: ${this.selectedDate}`;
    this.elements.ticketTime.textContent = `Time: ${this.selectedTime}`;

    const seats = [...this.selectedSeats]
      .map(index => getSeatLabel(index, SEATS_PER_ROW))
      .join(', ') || 'None';
    this.elements.ticketSeats.textContent = `Seats: ${seats}`;

    const totalPrice = this.selectedSeats.size * SEAT_PRICE;
    this.elements.ticketTotal.textContent = `Total: ${totalPrice}₴`;
  }

  hideTicketInfo() {
    this.elements.ticketInfo.classList.remove('show');
  }
}

const app = new BookingApp();