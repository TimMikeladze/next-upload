import gql from 'graphql-tag';

export const typeDefs = gql`
  type SignedUploadUrl {
    data: JSON!
    url: String!
    id: String!
  }

  input GetSignedUploadUrlInput {
    name: String
    id: String
    data: JSON
    type: String
  }

  extend type Mutation {
    getSignedUploadUrl(input: GetSignedUploadUrlInput!): SignedUploadUrl!
  }
`;
