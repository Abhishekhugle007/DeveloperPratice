
import './App.css'
import './components/Button/Button'
import Button from './components/Button/Button'


function App() {
  
  return (
    <div>
      <Button text="click me" onClickHandler={()=> console.log("click me")}/>
       <Button text="click me2" onClickHandler={()=> console.log("click me2")}/>
        <Button text="click me3" onClickHandler={()=> console.log("click me3")}/>
    </div>
  
  )
}
export default App
