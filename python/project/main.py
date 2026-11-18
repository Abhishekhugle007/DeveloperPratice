# expense Tracker Project

expensesList = [] 

print("Welcome to Expense Tracker : save some money")

while True:
    print("===MENU===")
    print("1. Add Expense")
    print("2. View All Expenses")
    print("3. view total money")
    print("4. Exist")

    choice = int(input("please Enter your Choice :"))


#Add Expense
    if(choice ==1):
        date = input("which date i have to spend the money? :")
        category= input("which kind of spend money ?(Food, travel, Books):")
        description= input("GIVE ME MORE DETAILS:")
        amount = float(input("Enter the  amount: "))

        expense ={
            "date": date,
            "category": category,
            "description": description,
            "amount": amount
        }

        expensesList.append(expense)
        print("Expense is Added Successfully")

# View Expenses

    elif(choice ==2):
        if(len(expensesList) == 0):
           print("No Expenses Added. please spend some money.")
        else:
            print("=== this is all expense ====")
            count = 1
            for eachExpense in expensesList:
                print(f"expense Number{count} ->{eachExpense["date"]},{eachExpense["category"]}, {eachExpense["description"]},{eachExpense["amount"]}")
                count = count+1

# view total spending
    
    elif(choice == 3):
        total =0
        for eachExpense in expensesList:
            total= total +eachExpense("amount")

            print("\n Total Expense = ",total)


# EXIST

    elif(choice == 4):
        print("Thank you for using System")
        break

    else:
        print("Invalid Choice:")



    
