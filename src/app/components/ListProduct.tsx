"use client";

import { useEffect, useState } from "react";
import { Price } from "../../../@types";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SubscribeButton from "./ButtonCheckout";

interface Customer {
    id: string;
    name?: string;
    email?: string;
}

const ListProduct = () => {
    const [prices, setPrices] = useState<Price[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<
        Customer | undefined
    >();
    const [isLoading, setIsLoading] = useState(true);

    async function fetchPrices(): Promise<Price[]> {
        const response = await fetch("/api/prices");
        if (!response.ok) {
            throw new Error("Failed to fetch prices");
        }
        const data: Price[] = await response.json();
        return data;
    }

    async function fetchCustomers(): Promise<Customer[]> {
        const response = await fetch("/api/customers/list");
        if (!response.ok) {
            throw new Error("Failed to fetch customers");
        }
        const data = await response.json();
        return data.customers;
    }

    useEffect(() => {
        (async () => {
            try {
                const result = await fetchPrices();
                setPrices(result);
                const customerData = await fetchCustomers();
                setCustomers(customerData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    if (isLoading) {
        return <div className="text-center mt-10">Loading products...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="mt-5">
            <h2 className="my-10 text-4xl font-bold uppercase">List package</h2>
            <div className="flex items-center justify-center gap-5">
                {prices.map((price) => (
                    <Card
                        key={price.id}
                        className="w-80 shadow-md p-5"
                    >
                        <CardHeader>
                            <CardTitle>{price.product.name}</CardTitle>
                            <CardDescription>
                                {price.product.description ||
                                    "No description available"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-semibold">
                                {price.unit_amount / 100}{" "}
                                {price.currency.toUpperCase()}/{" "}
                                {price.recurring?.interval}
                            </p>
                            <p className="text-sm text-gray-500"></p>
                        </CardContent>
                        <CardFooter>
                            <SubscribeButton priceId={price.id} userId={selectedCustomer?.id} />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ListProduct;
