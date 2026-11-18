class Laptop:
    brand = "Dell"

    @classmethod
    def show_brand(cls):
        print(cls.brand)

Laptop.show_brand()