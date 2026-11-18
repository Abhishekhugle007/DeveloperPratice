class Laptop:
    def start(self):
        print("Laptop started")

class Dell(Laptop):
    def gaming(self):
        print("Gaming mode ON")

d = Dell()
d.start()
d.gaming()