import express, {NextFunction, Request, Response} from "express";
const app = express();
const PORT: number = 80;

app.listen(PORT, () => console.log(`Running on port ${PORT}`)); //listens for requests on port 80

const arr:string[] = [];
app.use(express.json());
app.use(express.urlencoded());

function middleTest(req: Request, res: Response, next: NextFunction) {
    console.log(req.query);
    next();
}

app.get("/login", (req: Request, res: Response) => {
    res.send(arr);
})


app.post("/login", (req: Request, res: Response) => {
    console.log(req.body);
    arr.push(req.body);
    res.send(201);
});
