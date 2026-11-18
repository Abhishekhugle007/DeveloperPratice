class Student:
    def __init__(self):
        self.name = "Abhiashekh"
        self.__marks = 90

    def display(self):
        print(self.name)
        print(self.__marks)

s1 = Student()
s1.display()