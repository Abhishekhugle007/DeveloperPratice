class Event{
    constructor(dateOfEvent){
        this.dateOfEvent=dateOfEvent;
    }
    bookEvent(){
        console.log("booked Event");
    }
}
class Movie extends Event{
    constructor(MovieName, MovieDate, bookEvent){
        super(MovieDate);
        this.MovieName = MovieName;
        this.bookEvent=bookEvent;
    }
}
let dp = new Movie("Deadpool", "2026-06-29", "Wednesday");
console.log(dp)