import { useRouter } from "next/router";

export default function Practica(){
    const router =useRouter();
    const { id } = router.query;

    return(
        <main>
            <h1> Ruta Dinamica</h1>
            <p>El parametro capturado por next es: {id} </p>
        </main>
    )
}