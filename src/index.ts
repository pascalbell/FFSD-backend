import express, {NextFunction, Request, Response} from "express";
const app = express();
const PORT: number = 80;


const arr:string[] = [];
app.use(express.json());
app.use(express.urlencoded());


app.get("/api/login", (req: Request, res: Response) => {
    res.send(arr);
})


app.post("/api/login", (req: Request, res: Response) => {
    if (!req.body.username || !req.body.password) {
        res.status(422).json({error: true});
        return;
    }
    console.log(req.body);
    arr.push(req.body);
    res.send(201);  //status didnt work for some reason
});


app.listen(PORT, () => console.log(`Running on port ${PORT}`)); //listens for requests on port 80