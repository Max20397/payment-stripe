"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
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

interface FormInputs {
    name: string;
    price: number;
    recurring: string;
}

const ListProduct = () => {
    const [prices, setPrices] = useState<Price[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { register, handleSubmit, reset } = useForm<FormInputs>();

    async function fetchPrices(): Promise<Price[]> {
        const response = await fetch("/api/prices");
        if (!response.ok) {
            throw new Error("Failed to fetch prices");
        }
        const data: Price[] = await response.json();
        return data;
    }

    useEffect(() => {
        (async () => {
            try {
                const result = await fetchPrices();
                setPrices(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            }
        })();
    }, []);

    const onSubmit: SubmitHandler<FormInputs> = (data) => {
        const newPrice: Price = {
            id: `temp_${Date.now()}`,
            object: "price",
            active: true,
            billing_scheme: "per_unit",
            created: Date.now(),
            currency: "usd",
            custom_unit_amount: null,
            livemode: false,
            lookup_key: null,
            metadata: {},
            nickname: null,
            product: {
                id: `prod_${Date.now()}`,
                object: "product",
                active: true,
                attributes: [],
                created: Date.now(),
                default_price: `temp_${Date.now()}`,
                description: null,
                images: [],
                livemode: false,
                marketing_features: [],
                metadata: {},
                name: data.name,
                package_dimensions: null,
                shippable: null,
                statement_descriptor: null,
                tax_code: null,
                type: "service",
                unit_label: null,
                updated: Date.now(),
                url: null,
            },
            recurring: {
                interval: data.recurring,
                interval_count: 1,
                meter: null,
                trial_period_days: null,
                usage_type: "licensed",
            },
            tax_behavior: "unspecified",
            tiers_mode: null,
            transform_quantity: null,
            type: "recurring",
            unit_amount: data.price * 100,
            unit_amount_decimal: (data.price * 100).toString(),
        };

        setPrices((prev) => [newPrice, ...prev]);
        reset();
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="flex h-screen">
            <div className="p-4 flex flex-wrap gap-4 justify-center overflow-y-auto w-full">
                <h2>List package</h2>
                {prices.map((price) => (
                    <Card
                        key={price.id}
                        className="w-80 h-48 shadow-md overflow-hidden"
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
                                Price: {price.currency.toUpperCase()}{" "}
                                {price.unit_amount / 100}
                            </p>
                            <p className="text-sm text-gray-500">
                                Recurring: {price.recurring?.interval}
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Button>Register</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ListProduct;
