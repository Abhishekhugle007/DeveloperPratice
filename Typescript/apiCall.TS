type Iphone = {
    id: number;
    model: string;
    price: number;
    color: string;
};

async function getIphones(): Promise<Iphone[]> {
    const response = await fetch(
        "https://jsonplaceholder.typicode.com/todos/1"
    );

    const data: Iphone[] = await response.json();

    return data;
}

async function main() {
    const iphones = await getIphones();

    iphones.forEach((iphone) => {
        console.log(iphone.model);
        console.log(iphone.price);
    });
}

main();
