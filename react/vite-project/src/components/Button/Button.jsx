function Button({text} ,onClickHandler){

  console.log(text); // object
  return(
  <button onClick={ onClickHandler}
    className="btn"
  >
    {text} 
    </button>
  );
}
export default Button