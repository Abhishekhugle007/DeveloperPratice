
import datetime

name = input("Swagat h, enter your name :")

presentHour = datetime.datetime.now().hour

if 5 <= presentHour < 12:
    print("Good morning")
elif 12 <= presentHour < 17:
    print("Good afternoon,", name)
elif 17 <= presentHour < 21:
    print("Good Evening,", name)
else:
    print("Good night,", name)

print("Namaste! Welcome to your Buddy ChatBot ")
print("You can ask me basic questions.")
print("Type 'bye' to exit from the bot.\n")



response = {
    "hello": "Hi! Welcome. How can I help you?",
    "hi": "Hello! Nice to meet you.",
    "how are you": "I am very fine. Thank you!",
    "who are you": "I am your smart AI ChatBot.",
    "what is your name": "My name is Buddy ChatBot.",
    "what can you do": "I can answer your basic questions.",
    "how old are you": "I am an AI chatbot. I don't have an age!",
    "what is python": "Python is a popular programming language.",
    "thank you": "You're most welcome!",
    "bye": "Goodbye! Have a nice day.",
    "good morning": "Good morning! Have a wonderful day.",
    "good night": "Good night! Sweet dreams."
}

def getResponseBot(userQuestion):
    userQuestion = userQuestion.lower()
    for eachKey in response:
        if eachKey in userQuestion:
            return response[eachKey]

    return "I am not able to tell that yet . MAI JADLI HI YE SIKH LUNGA"

while True:
    userInput = input("please ask me question:")
    reply = getResponseBot(userInput)
    print("Bot Response:", reply)

    if "bye" in userInput.lower():
        break