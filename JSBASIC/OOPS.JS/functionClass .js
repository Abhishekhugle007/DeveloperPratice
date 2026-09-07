function Event(dataOfEvent) {
    this.dataOfEvent = dataOfEvent;
}

Event.prototype.bookEvent = function() {
    console.log("Booking Event");
};

function f() {
    console.log("booking Event");
}

function Movie(MovieName, MovieDate) {
    Event.call(this, MovieDate);
    this.MovieName = MovieName;
}

Movie.prototype = Object.create(Event.prototype);

let dp = new Movie("Deadpool", "20/3/2222");

console.log(dp);
dp.bookEvent();
