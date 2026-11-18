class Laptop:
    def start(self):
        print("Laptop starting")

class Dell(Laptop):
    def start(self):
        print("Dell laptop starting")

d = Dell()
d.start()