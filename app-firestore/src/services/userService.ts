import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    QueryDocumentSnapshot,
    serverTimestamp,
    startAfter,
    updateDoc,
    where,
} from "firebase/firestore";

import { db } from "../config/firebase";
import { User } from "../types/User";

const COLLECTION_NAME = "users";


// CREATE

export async function createUser(
    user: User
) {
    const docRef = await addDoc(
        collection(
            db,
            COLLECTION_NAME
        ),
        {
            name: user.name,
            email: user.email,
            createdAt: serverTimestamp(),
        }
    );

    return docRef.id;
}


// READ

export async function getUsers():
    Promise<User[]> {

    const snapshot =
        await getDocs(
            collection(
                db,
                COLLECTION_NAME
            )
        );

    return snapshot.docs.map(
        (document) => ({
            id: document.id,
            name: document.data().name,
            email: document.data().email,
        })
    );
}


// UPDATE

export async function updateUser(
    id: string,
    user: Partial<User>
) {
    const userRef = doc(
        db,
        COLLECTION_NAME,
        id
    );

    await updateDoc(
        userRef,
        {
            ...user,
            updatedAt: serverTimestamp(),
        }
    );
}


// DELETE

export async function deleteUser(
    id: string
) {
    const userRef = doc(
        db,
        COLLECTION_NAME,
        id
    );

    await deleteDoc(userRef);
}


// QUERY + WHERE

export async function findUsersByEmail(
    email: string
): Promise<User[]> {

    const q = query(
        collection(
            db,
            COLLECTION_NAME
        ),

        where(
            "email",
            "==",
            email
        )
    );

    const snapshot =
        await getDocs(q);

    return snapshot.docs.map(
        (document) => ({
            id: document.id,
            name: document.data().name,
            email: document.data().email,
        })
    );
}


// ORDER BY

export async function getUsersOrdered():
    Promise<User[]> {

    const q = query(
        collection(
            db,
            COLLECTION_NAME
        ),
        orderBy("name", "asc")
    );

    const snapshot =
        await getDocs(q);

    return snapshot.docs.map(
        (document) => ({
            id: document.id,
            name: document.data().name,
            email: document.data().email,
        })
    );
}


// PAGINAÇÃO

export interface PaginatedUsers {
    users: User[];

    lastDocument:
    | QueryDocumentSnapshot
    | null;

    hasMore: boolean;
}

export async function getUsersPaginated(
    pageSize: number = 10,
    lastDocument?: QueryDocumentSnapshot
): Promise<PaginatedUsers> {

    const usersRef = collection(
        db,
        COLLECTION_NAME
    );

    const q = lastDocument
        ? query(
            usersRef,
            orderBy("name"),
            startAfter(lastDocument),
            limit(pageSize)
        )
        : query(
            usersRef,
            orderBy("name"),
            limit(pageSize)
        );

    const snapshot =
        await getDocs(q);

    const users =
        snapshot.docs.map(
            (document) => ({
                id: document.id,
                name: document.data().name,
                email: document.data().email,
            })
        );

    const lastVisible =
        snapshot.docs.length > 0
            ? snapshot.docs[
            snapshot.docs.length - 1
            ]
            : null;

    return {
        users,
        lastDocument: lastVisible,
        hasMore:
            snapshot.docs.length === pageSize,
    };
}


// REAL TIME

export function subscribeToUsers(
    callback:
        (users: User[]) => void
) {
    const q = query(
        collection(
            db,
            COLLECTION_NAME
        ),
        orderBy("name")
    );

    return onSnapshot(
        q,
        (snapshot) => {
            const users =
                snapshot.docs.map(
                    (document) => ({
                        id: document.id,
                        name: document.data().name,
                        email: document.data().email,
                    })
                );

            callback(users);
        }
    );
}