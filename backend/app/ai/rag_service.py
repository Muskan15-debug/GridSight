import os
from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer


class RAGService:

    def __init__(self):

        self.base_dir = Path(__file__).resolve().parents[1]

        self.documents_dir = (
            self.base_dir / "knowledge" / "documents"
        )

        self.vector_store_dir = (
            self.base_dir / "knowledge" / "vector_store"
        )

        self.vector_store_dir.mkdir(
            parents=True,
            exist_ok=True
        )

        self.embedding_model = SentenceTransformer(
            "all-MiniLM-L6-v2"
        )

        self.client = chromadb.PersistentClient(
            path=str(self.vector_store_dir)
        )

        self.collection = self.client.get_or_create_collection(
            name="gridsight_energy_knowledge"
        )

    def load_documents(self):

        documents = []
        ids = []
        metadatas = []

        for file_path in self.documents_dir.glob("*.md"):

            text = file_path.read_text(
                encoding="utf-8"
            )

            documents.append(text)

            ids.append(file_path.stem)

            metadatas.append({
                "source": file_path.name
            })

        if not documents:
            raise ValueError(
                "No knowledge documents found."
            )

        embeddings = self.embedding_model.encode(
            documents
        ).tolist()

        self.collection.upsert(
            documents=documents,
            embeddings=embeddings,
            ids=ids,
            metadatas=metadatas
        )

        return len(documents)

    def retrieve(
        self,
        query: str,
        top_k: int = 3
    ):

        query_embedding = self.embedding_model.encode(
            [query]
        ).tolist()

        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=top_k
        )

        retrieved_documents = results.get(
            "documents",
            [[]]
        )[0]

        retrieved_metadata = results.get(
            "metadatas",
            [[]]
        )[0]

        return [
            {
                "content": document,
                "source": metadata.get("source")
            }
            for document, metadata
            in zip(
                retrieved_documents,
                retrieved_metadata
            )
        ]