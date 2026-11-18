from abc import ABC, abstractmethod

class Laptop(ABC):
    @abstractmethod
    def start(self):
        pass

class Dell(Laptop):
    def start(self):
        print("Dell laptop started")

d = Dell()
d.start()