import { mount } from "svelte";
import TicTacToe from "./TicTacToe.svelte";
import "./app.css";

mount(TicTacToe, { target: document.querySelector("#app")! });
