const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedRecipes() {
  try {
    console.log('Iniciando configuración de recetas...');

    // Obtener todos los productos para poder buscar sus IDs
    const products = await prisma.product.findMany();
    
    // Función auxiliar para encontrar un producto por parte de su descripción
    const getProduct = (desc) => {
      const p = products.find(p => p.description.includes(desc));
      if (!p) throw new Error(`Producto no encontrado: ${desc}`);
      return p;
    };

    // Definición de las recetas (Cantidades por cada unidad del producto final)
    const recipesData = [
      {
        finalProductDesc: 'Chorizo Parrillero Pre-cocido',
        // Paquete de 500g
        items: [
          { desc: 'Carne de Cerdo (Pierna)', quantity: 0.350 }, // 350g
          { desc: 'Grasa de Cerdo', quantity: 0.150 }, // 150g
          { desc: 'Pimienta Negra', quantity: 0.002 }, // 2g
          { desc: 'Ajo en Polvo', quantity: 0.003 }, // 3g
          { desc: 'Sal Cura', quantity: 0.001 }, // 1g
          { desc: 'Tripa de Colágeno', quantity: 0.020 }, // 0.02 rollos por paquete
          { desc: 'Bolsas Empaque', quantity: 0.001 }, // 1 bolsa (0.001 millares)
          { desc: 'Etiquetas Chorizo', quantity: 0.001 } // 1 etiqueta
        ]
      },
      {
        finalProductDesc: 'Salchicha Huachana',
        // Paquete de 500g
        items: [
          { desc: 'Carne de Cerdo (Paleta)', quantity: 0.300 },
          { desc: 'Grasa de Cerdo', quantity: 0.200 },
          { desc: 'Ajo en Polvo', quantity: 0.005 },
          { desc: 'Sal Cura', quantity: 0.001 },
          { desc: 'Tripa Natural', quantity: 0.050 }, // 0.05 madejas
          { desc: 'Bolsas Empaque', quantity: 0.001 }
        ]
      },
      {
        finalProductDesc: 'Salchicha de Viena',
        // Paquete de 1 KG
        items: [
          { desc: 'Carne de Pollo (MDM)', quantity: 0.500 }, // 500g
          { desc: 'Carne de Res', quantity: 0.300 }, // 300g
          { desc: 'Grasa de Cerdo', quantity: 0.200 }, // 200g
          { desc: 'Fosfato de Sodio', quantity: 0.003 },
          { desc: 'Sal Cura', quantity: 0.002 },
          { desc: 'Humo Líquido', quantity: 0.005 }, // 5ml
          { desc: 'Tripa de Celulosa', quantity: 0.030 }, // 0.03 rollos
          { desc: 'Bolsas Empaque', quantity: 0.001 }
        ]
      },
      {
        finalProductDesc: 'Jamón Inglés Especial',
        // Molde de 3 KG
        items: [
          { desc: 'Carne de Cerdo (Pierna)', quantity: 3.200 }, // 3.2 KG (considerando mermas de cocción)
          { desc: 'Fosfato de Sodio', quantity: 0.015 },
          { desc: 'Sal Cura', quantity: 0.006 },
          { desc: 'Humo Líquido', quantity: 0.010 },
          { desc: 'Bolsas Empaque', quantity: 0.001 }
        ]
      },
      {
        finalProductDesc: 'Tocino Ahumado Tajado',
        // Paquete de 250g
        items: [
          { desc: 'Grasa de Cerdo (Papada / Tocino)', quantity: 0.300 }, // 300g crudo
          { desc: 'Sal Cura', quantity: 0.001 },
          { desc: 'Humo Líquido', quantity: 0.002 },
          { desc: 'Bolsas Empaque', quantity: 0.001 }
        ]
      }
    ];

    let count = 0;

    for (const recipeDef of recipesData) {
      try {
        const finalProduct = getProduct(recipeDef.finalProductDesc);
        
        // Verificar si ya existe una receta para este producto
        let recipe = await prisma.productRecipe.findUnique({
          where: { finalProductId: finalProduct.id }
        });

        if (recipe) {
          // Si existe, borramos los items anteriores para actualizarlos
          await prisma.productRecipeItem.deleteMany({
            where: { recipeId: recipe.id }
          });
          console.log(`Actualizando receta para: ${finalProduct.description}`);
        } else {
          // Si no existe, creamos la cabecera
          recipe = await prisma.productRecipe.create({
            data: { finalProductId: finalProduct.id }
          });
          console.log(`Creando nueva receta para: ${finalProduct.description}`);
        }

        // Preparar los items de la receta
        const itemsToCreate = recipeDef.items.map(itemDef => {
          const inputProduct = getProduct(itemDef.desc);
          return {
            recipeId: recipe.id,
            inputId: inputProduct.id,
            quantity: itemDef.quantity
          };
        });

        // Insertar los items
        await prisma.productRecipeItem.createMany({
          data: itemsToCreate
        });

        count++;
      } catch (err) {
        console.warn(`Saltando receta de ${recipeDef.finalProductDesc}: ${err.message}`);
      }
    }

    console.log(`¡Carga de recetas completada! Se configuraron ${count} recetas.`);
  } catch (error) {
    console.error('Error configurando recetas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedRecipes();
