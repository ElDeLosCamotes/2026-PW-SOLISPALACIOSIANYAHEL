import { Main } from "next/document";
import Link from "next/link";

export default function Home(){
    return(
        <main>
            <h1>Esto es un ejemplo de Pagina Principal con Next</h1>

            <p>
                <Link href="/practica/1">Ir a Pagina 2</Link>
            </p>
        </main>
    );
}